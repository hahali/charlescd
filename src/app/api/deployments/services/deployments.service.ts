import { Injectable } from '@nestjs/common'
import { CreateDeploymentDto, ReadDeploymentDto } from '../dto'
import { DeploymentEntity } from '../entity'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { ConsoleLoggerService } from '../../../core/logs/console'
import { QueuedDeploymentsService } from './queued-deployments.service'
import { ReadQueuedDeploymentDto } from '../dto/read-queued-deployment.dto'

@Injectable()
export class DeploymentsService {

  constructor(
    private readonly consoleLoggerService: ConsoleLoggerService,
    private readonly queuedDeploymentsService: QueuedDeploymentsService,
    @InjectRepository(DeploymentEntity)
    private readonly deploymentsRepository: Repository<DeploymentEntity>
  ) {}

  public async createDeployment(createDeploymentDto: CreateDeploymentDto): Promise<ReadDeploymentDto> {
    this.consoleLoggerService.log(`START:CREATE_DEPLOYMENT`, createDeploymentDto)
    const deployment: DeploymentEntity =
      await this.deploymentsRepository.save(createDeploymentDto.toEntity())

    await this.queuedDeploymentsService.queueDeploymentTasks(deployment)
    const deploymentReadDto: ReadDeploymentDto = deployment.toReadDto()
    this.consoleLoggerService.log(`FINISH:CREATE_DEPLOYMENT`, deploymentReadDto)
    return deploymentReadDto
  }

  public async getDeployments(): Promise<ReadDeploymentDto[]> {
    return this.deploymentsRepository.find({ relations: ['modules'] })
      .then(deployments => deployments.map(deployment => deployment.toReadDto()))
  }

  public async getDeploymentById(id: string): Promise<ReadDeploymentDto> {
    return this.deploymentsRepository.findOne({where: { id }, relations: ['modules']})
      .then(deployment => deployment.toReadDto())
  }

  public async getComponentDeploymentQueue(id: string): Promise<ReadQueuedDeploymentDto[]> {
    return this.queuedDeploymentsService.getComponentDeploymentQueue(id)
      .then(queuedDeployments => queuedDeployments.map(
        queuedDeployment => queuedDeployment.toReadDto()
        )
      )
  }
}
